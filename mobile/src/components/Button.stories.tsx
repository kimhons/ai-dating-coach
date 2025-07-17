import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { View } from 'react-native';
import { AnimatedButton } from './animations/MicroInteractions';
import LinearGradient from 'react-native-linear-gradient';
import { Text } from 'react-native';

export default {
  title: 'Components/AnimatedButton',
  component: AnimatedButton,
  parameters: {
    docs: {
      description: {
        component: 'An animated button with haptic feedback and scale animation on press.',
      },
    },
  },
  argTypes: {
    haptic: {
      control: 'boolean',
      description: 'Enable haptic feedback on press',
      defaultValue: true,
    },
    scale: {
      control: { type: 'range', min: 0.8, max: 1, step: 0.05 },
      description: 'Scale factor when pressed',
      defaultValue: 0.95,
    },
  },
} as ComponentMeta<typeof AnimatedButton>;

const Template: ComponentStory<typeof AnimatedButton> = (args) => (
  <View style={{ padding: 20, alignItems: 'center' }}>
    <AnimatedButton {...args}>
      <LinearGradient
        colors={['#E91E63', '#AD1457']}
        style={{
          paddingHorizontal: 32,
          paddingVertical: 16,
          borderRadius: 30,
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
          Animated Button
        </Text>
      </LinearGradient>
    </AnimatedButton>
  </View>
);

export const Default = Template.bind({});
Default.args = {
  onPress: () => console.log('Button pressed!'),
  haptic: true,
  scale: 0.95,
};

export const NoHaptic = Template.bind({});
NoHaptic.args = {
  ...Default.args,
  haptic: false,
};

export const SubtleAnimation = Template.bind({});
SubtleAnimation.args = {
  ...Default.args,
  scale: 0.98,
};

export const StrongAnimation = Template.bind({});
StrongAnimation.args = {
  ...Default.args,
  scale: 0.9,
};

// Story for documentation
export const UsageExample = () => (
  <View style={{ padding: 20 }}>
    <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
      Usage Example
    </Text>
    <Text style={{ marginBottom: 20 }}>
      The AnimatedButton component provides a smooth scale animation and optional haptic feedback
      when pressed. It's perfect for primary actions in your app.
    </Text>
    
    <AnimatedButton onPress={() => console.log('Example pressed!')}>
      <View
        style={{
          backgroundColor: '#E91E63',
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: 'white' }}>Example Button</Text>
      </View>
    </AnimatedButton>
  </View>
);

UsageExample.parameters = {
  docs: {
    storyDescription: 'A complete example showing how to use the AnimatedButton component.',
  },
};