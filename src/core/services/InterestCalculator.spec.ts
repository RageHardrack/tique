import { describe, it, expect } from 'vitest';

import { InterestCalculator } from './InterestCalculator';

describe('InterestCalculator', () => {
  it('should calculate simple interest correctly', () => {
    const calculator = new InterestCalculator();
    const result = calculator.calculateSimpleInterest(1000, 0.05, 2);
    expect(result).toBe(100);
  });

  it('should return 0 when principal is 0', () => {
    const calculator = new InterestCalculator();
    const result = calculator.calculateSimpleInterest(0, 0.05, 2);
    expect(result).toBe(0);
  });
});
