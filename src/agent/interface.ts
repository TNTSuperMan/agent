export type AgentRet<T> = [Promise<T>, AsyncGenerator<YieldData>];
export type YieldData = {
  type: "log" | "stream";
  message: string;
};

export const wrap = <A extends unknown[], T>(
  fn: (...args: A) => AsyncGenerator<YieldData, T>,
): ((...args: A) => [Promise<T>, AsyncGenerator<YieldData>]) => {
  return (...args) => {
    const { promise, resolve } = Promise.withResolvers<T>();
    const iter = fn(...args);
    return [
      promise,
      {
        async next() {
          const result = await iter.next();
          if (result.done) {
            resolve(result.value);
          }
          return result;
        },
        return: iter.return.bind(iter),
        throw: iter.throw.bind(iter),
        [Symbol.asyncIterator]() {
          return this;
        },
        [Symbol.asyncDispose]: iter[Symbol.asyncDispose].bind(iter),
      },
    ];
  };
};
