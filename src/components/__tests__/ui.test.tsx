import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { PrimaryButton, SecondaryButton, Card, Pill } from '@/components/ui';

describe('UI components', () => {
  it('PrimaryButton renders label', () => {
    render(<PrimaryButton label="Start" onPress={() => {}} />);
    expect(screen.getByText('Start')).toBeTruthy();
  });

  it('SecondaryButton renders label', () => {
    render(<SecondaryButton label="Skip" onPress={() => {}} />);
    expect(screen.getByText('Skip')).toBeTruthy();
  });

  it('Card renders children', () => {
    render(<Card><Text>inner</Text></Card>);
    expect(screen.getByText('inner')).toBeTruthy();
  });

  it('Pill renders label', () => {
    render(<Pill text="5x5" />);
    expect(screen.getByText('5x5')).toBeTruthy();
  });
});
