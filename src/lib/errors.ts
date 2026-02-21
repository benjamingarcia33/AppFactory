export class CancelledError extends Error {
  constructor(message = "Operation was cancelled") {
    super(message);
    this.name = "CancelledError";
  }
}
