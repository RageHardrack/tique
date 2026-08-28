/**
 * Service to perform interest-related financial calculations.
 * This class is completely framework-agnostic.
 */
export class InterestCalculator {
  /**
   * Calculates simple interest.
   * Formula: Interest = Principal * Rate * Time
   *
   * @param principal The starting amount
   * @param rate The interest rate per period (decimal, e.g., 0.05 for 5%)
   * @param time The number of periods
   */
  calculateSimpleInterest(
    principal: number,
    rate: number,
    time: number,
  ): number {
    return principal * rate * time;
  }
}
