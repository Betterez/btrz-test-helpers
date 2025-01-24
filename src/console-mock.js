module.exports = {
  setup() {
    const stdout = require("test-console").stdout;
    return {
      inspect: stdout.inspect(),
      restore() {
        if (!this.inspect.restore) {
          throw new Error("You need to call setup() before calling restore()");
        }
        this.inspect.restore();
        return this.inspect.output;
      },
      get(KEY, indexOffset = 0) {
        console.log("indexOffset", indexOffset);
        const index = ((this.inspect || {}).output || [])
          .findIndex((line) => {
            return line.indexOf(KEY) === 0;
          });
        return index >= 0 ? this.inspect.output[index + indexOffset] : null;
      },
      getJSON(KEY, indexOffset = 0) {
        const line = this.get(KEY, indexOffset);
        return line ? JSON.parse(line) : null;
      }
    }
  },
}