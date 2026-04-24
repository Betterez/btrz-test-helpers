const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

describe("Console mock", () => {
  it("should return an object that mocks the console", () => {
    const {consoleMock} = require("../index.js");
    const mock = consoleMock.setup();
    mock.restore();
    assert.equal(mock.haha, undefined);
    assert.notEqual(mock.restore, undefined);
    assert.notEqual(mock.get, undefined);
    assert.notEqual(mock.getJSON, undefined);
  });

  it("should return the output of the console", () => {
    const {consoleMock} = require("../index.js");
    const mock = consoleMock.setup();
    console.log("Hello world!");
    const output = mock.restore();
    assert.deepEqual(output, ["Hello world!\n"]);
  });

  it("should return the output of the console with multiple logs", () => {
    const {consoleMock} = require("../index.js");
    const mock = consoleMock.setup();
    console.log("Hello world!");
    console.log("Hello world!");
    const output = mock.restore();
    assert.deepEqual(output, ["Hello world!\n", "Hello world!\n"]);
  });

  it("should return the output of the given matching string", () => {
    const {consoleMock} = require("../index.js");
    const mock = consoleMock.setup();
    console.log("Hello world!");
    console.log("WHE-PRE");
    console.log("Hello Webhook!");
    mock.restore();
    const result = mock.get("WHE-PRE")
    assert.equal(result, "WHE-PRE\n");
  });

  it("should return the output of the given matching string with index offset", () => {
    const {consoleMock} = require("../index.js");
    const mock = consoleMock.setup();
    console.log("Hello world!");
    console.log("WHE-PRE");
    console.log("Hello Webhook!");
    mock.restore();
    const result = mock.get("WHE-PRE", 1)
    assert.equal(result, "Hello Webhook!\n");
  });

  it("should return the output of the given matching string as JSON", () => {
    const {consoleMock} = require("../index.js");
    const mock = consoleMock.setup();
    console.log("Hello world!");
    console.log("PRE");
    console.log(JSON.stringify({"name": "John"}));
    console.log("Hello Webhook!");
    mock.restore();
    const result = mock.getJSON("PRE", 1)
    assert.deepEqual(result, {name: "John"});
  });
});