import async from "async";

export function runOnlyOneSequentially(fn: (...args: any[]) => any) {
  // create a cargo object with an infinite payload
  const cargo = async.cargo(function(
    tasks: { args: any[] }[],
    callback: () => void
  ) {
    fn(...tasks[0].args).then(() => {
      callback();
    });
  },
  1e9);

  return function(...args: any[]) {
    cargo.push({ args });
  };
}

export function pause(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
