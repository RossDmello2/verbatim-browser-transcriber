const MIN_F0 = 70;
const MAX_F0 = 350;
const MIN_RMS = 0.008;
const MIN_PITCH_CONFIDENCE = 0.55;
const MEL_BANDS = 8;

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function mean(values) {
    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values, average) {
    if (values.length < 2) return 0;
    const variance = values.reduce((sum, value) => {
        const distance = value - average;
        return sum + distance * distance;
    }, 0) / values.length;
    return Math.sqrt(variance);
}

function hzToMel(frequency) {
    return 2595 * Math.log10(1 + frequency / 700);
}

function melToHz(mel) {
    return 700 * (10 ** (mel / 2595) - 1);
}

function detectPitch(timeData, sampleRate) {
    const length = timeData.length;
    let average = 0;
    for (let index = 0; index < length; index++) average += timeData[index];
    average /= length;

    const minLag = Math.max(2, Math.floor(sampleRate / MAX_F0));
    const maxLag = Math.min(length - 2, Math.ceil(sampleRate / MIN_F0));
    let bestLag = 0;
    let bestCorrelation = -1;
    const correlations = new Float32Array(maxLag + 1);

    for (let lag = minLag; lag <= maxLag; lag++) {
        let correlation = 0;
        let energyA = 0;
        let energyB = 0;
        const limit = length - lag;
        for (let index = 0; index < limit; index++) {
            const a = timeData[index] - average;
            const b = timeData[index + lag] - average;
            correlation += a * b;
            energyA += a * a;
            energyB += b * b;
        }
        const normalized = correlation / Math.sqrt(Math.max(1e-12, energyA * energyB));
        correlations[lag] = normalized;
        if (normalized > bestCorrelation) {
            bestCorrelation = normalized;
            bestLag = lag;
        }
    }

    if (!bestLag || bestCorrelation < MIN_PITCH_CONFIDENCE) return null;
    const left = correlations[bestLag - 1] || bestCorrelation;
    const right = correlations[bestLag + 1] || bestCorrelation;
    const denominator = left - 2 * bestCorrelation + right;
    const offset = Math.abs(denominator) > 1e-6
        ? 0.5 * (left - right) / denominator
        : 0;
    const refinedLag = bestLag + clamp(offset, -0.5, 0.5);
    return {
        f0: sampleRate / refinedLag,
        confidence: bestCorrelation
    };
}

function spectralFeatures(freqData, sampleRate) {
    const nyquist = sampleRate / 2;
    const maxFrequency = Math.min(8000, nyquist);
    const minFrequency = 80;
    const binWidth = nyquist / freqData.length;
    const minMel = hzToMel(minFrequency);
    const maxMel = hzToMel(maxFrequency);
    const edges = new Float32Array(MEL_BANDS + 1);
    for (let index = 0; index <= MEL_BANDS; index++) {
        edges[index] = melToHz(minMel + ((maxMel - minMel) * index) / MEL_BANDS);
    }

    const bandEnergy = new Float64Array(MEL_BANDS);
    const bandCount = new Uint16Array(MEL_BANDS);
    let weightedFrequency = 0;
    let totalMagnitude = 0;
    let bandIndex = 0;

    for (let bin = 1; bin < freqData.length; bin++) {
        const frequency = bin * binWidth;
        if (frequency < minFrequency) continue;
        if (frequency > maxFrequency) break;
        while (bandIndex < MEL_BANDS - 1 && frequency >= edges[bandIndex + 1]) bandIndex++;
        const decibels = Number.isFinite(freqData[bin]) ? freqData[bin] : -120;
        const magnitude = 10 ** (decibels / 20);
        bandEnergy[bandIndex] += magnitude * magnitude;
        bandCount[bandIndex]++;
        weightedFrequency += frequency * magnitude;
        totalMagnitude += magnitude;
    }

    const logBands = Array.from(bandEnergy, (energy, index) => (
        Math.log(Math.max(1e-10, energy / Math.max(1, bandCount[index])))
    ));
    const averageLogEnergy = mean(logBands);
    return {
        centroid: totalMagnitude > 0 ? weightedFrequency / totalMagnitude : 0,
        mfccLite: logBands.map(value => value - averageLogEnergy)
    };
}

export function extractFrameFeatures(timeData, freqData, sampleRate) {
    if (!timeData?.length || !freqData?.length || !Number.isFinite(sampleRate) || sampleRate <= 0) {
        return null;
    }
    let sumSquares = 0;
    for (let index = 0; index < timeData.length; index++) {
        sumSquares += timeData[index] * timeData[index];
    }
    const rms = Math.sqrt(sumSquares / timeData.length);
    if (rms < MIN_RMS) return null;

    const pitch = detectPitch(timeData, sampleRate);
    if (!pitch || pitch.f0 < MIN_F0 || pitch.f0 > MAX_F0) return null;
    const spectrum = spectralFeatures(freqData, sampleRate);
    if (!spectrum.centroid || spectrum.mfccLite.some(value => !Number.isFinite(value))) return null;

    return {
        f0: pitch.f0,
        voiced: true,
        rms,
        centroid: spectrum.centroid,
        mfccLite: spectrum.mfccLite
    };
}

export function createProfile(frames = []) {
    const voiced = frames.filter(frame => (
        frame?.voiced
        && Number.isFinite(frame.f0)
        && Number.isFinite(frame.centroid)
        && Array.isArray(frame.mfccLite)
        && frame.mfccLite.length === MEL_BANDS
    ));
    if (!voiced.length) throw new Error('No voiced frames were available for calibration');

    const f0Values = voiced.map(frame => frame.f0);
    const centroidValues = voiced.map(frame => frame.centroid);
    const f0Mean = mean(f0Values);
    const centroidMean = mean(centroidValues);
    const mfccMean = Array.from({ length: MEL_BANDS }, (_, index) => (
        mean(voiced.map(frame => frame.mfccLite[index]))
    ));
    const mfccStd = Array.from({ length: MEL_BANDS }, (_, index) => (
        standardDeviation(voiced.map(frame => frame.mfccLite[index]), mfccMean[index])
    ));

    return {
        f0Mean,
        f0Std: standardDeviation(f0Values, f0Mean),
        centroidMean,
        centroidStd: standardDeviation(centroidValues, centroidMean),
        mfccMean,
        mfccStd,
        frameCount: voiced.length,
        version: 1
    };
}

function gaussianSimilarity(distance) {
    const bounded = Math.min(25, distance * distance);
    return Math.exp(-0.5 * bounded);
}

export function scoreFrame(profile, frameFeatures) {
    if (profile?.version !== 1 || !frameFeatures?.voiced) return 0;
    if (!Array.isArray(profile.mfccMean)
        || !Array.isArray(profile.mfccStd)
        || profile.mfccMean.length !== MEL_BANDS
        || frameFeatures.mfccLite?.length !== MEL_BANDS) return 0;

    const f0Distance = Math.abs(frameFeatures.f0 - profile.f0Mean)
        / Math.max(12, Number(profile.f0Std) || 0);
    const centroidDistance = Math.abs(frameFeatures.centroid - profile.centroidMean)
        / Math.max(300, Number(profile.centroidStd) || 0);
    let melDistanceSquared = 0;
    for (let index = 0; index < MEL_BANDS; index++) {
        const distance = Math.abs(frameFeatures.mfccLite[index] - profile.mfccMean[index])
            / Math.max(0.35, Number(profile.mfccStd[index]) || 0);
        melDistanceSquared += Math.min(25, distance * distance);
    }
    const melDistance = Math.sqrt(melDistanceSquared / MEL_BANDS);
    const score = 0.35 * gaussianSimilarity(f0Distance)
        + 0.5 * gaussianSimilarity(melDistance)
        + 0.15 * gaussianSimilarity(centroidDistance);
    return clamp(score, 0, 1);
}

export function scoreWindow(profile, frames = [], frameMatchMin = 0.62) {
    const voiced = frames.filter(frame => frame?.voiced);
    if (!voiced.length) return { matchFraction: 0, voicedFrames: 0 };
    let matches = 0;
    for (const frame of voiced) {
        if (scoreFrame(profile, frame) >= frameMatchMin) matches++;
    }
    return {
        matchFraction: matches / voiced.length,
        voicedFrames: voiced.length
    };
}

export function updateProfile(profile, frames = [], rate = 0.02) {
    if (profile?.version !== 1) return profile;
    const next = createProfile(frames);
    const amount = clamp(Number(rate) || 0, 0, 0.2);
    const blend = (current, candidate) => current + (candidate - current) * amount;
    return {
        f0Mean: blend(profile.f0Mean, next.f0Mean),
        f0Std: blend(profile.f0Std, next.f0Std),
        centroidMean: blend(profile.centroidMean, next.centroidMean),
        centroidStd: blend(profile.centroidStd, next.centroidStd),
        mfccMean: profile.mfccMean.map((value, index) => blend(value, next.mfccMean[index])),
        mfccStd: profile.mfccStd.map((value, index) => blend(value, next.mfccStd[index])),
        frameCount: Number(profile.frameCount || 0) + next.frameCount,
        version: 1
    };
}
