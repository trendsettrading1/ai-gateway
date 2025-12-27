import React from 'react';
import { View, Text } from 'react-native';

export default function App() {
  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'skyblue'}}>
      <Text style={{fontSize: 32}}>Weather App</Text>
      <Text style={{fontSize: 64}}>72Â°F</Text>
    </View>
  );
}