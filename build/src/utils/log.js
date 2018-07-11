function ProgressTracker(log, round) {
  this.prev = this.bytes = 0;
  this.round = round;

  this.track = (chunk) => {
    if (this.round(this.bytes += chunk.length) > this.prev)
      {log(this.prev = this.round(this.bytes));}
  };
}
