import { expect, type Mock } from 'vitest';

/** Configure argument-specific returns while keeping the mock's default implementation. */
export function mockReturnValueForArgs(
  mock: Mock<(...args: Array<unknown>) => unknown>,
  args: Array<unknown>,
  value: unknown
): void {
  const fallback = mock.getMockImplementation();
  const matcher = expect.objectContaining({ args }) as { asymmetricMatch: (value: unknown) => boolean };
  mock.mockImplementation((...actual: Array<unknown>) => {
    if (matcher.asymmetricMatch({ args: actual })) {
      return value;
    }

    return fallback?.(...actual);
  });
}
