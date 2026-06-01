import { View } from 'react-native';

import VerbatimDom from '../components/verbatim-dom';

export default function VerbatimScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#f7f8fb' }}>
      <VerbatimDom
        dom={{
          scrollEnabled: true,
          contentInsetAdjustmentBehavior: 'never',
          style: { flex: 1, width: '100%', height: '100%' }
        }}
      />
    </View>
  );
}
