describe("Console mock", () => {
  const {expect} = require("chai");

  it("should return an object that mocks the console", () => {
    const {consoleMock} = require("../index.js");
    const mock = consoleMock.setup();
    mock.restore();
    expect(mock.haha).to.be.undefined;
    expect(mock.restore).to.not.eql(undefined);
    expect(mock.get).to.not.eql(undefined);
    expect(mock.getJSON).to.not.eql(undefined);
  });

  it("should return the output of the console", () => {
    const {consoleMock} = require("../index.js");
    const mock = consoleMock.setup();
    console.log("Hello world!");
    const output = mock.restore();
    expect(output).to.eql(["Hello world!\n"]);
  });

  it("should return the output of the console with multiple logs", () => {
    const {consoleMock} = require("../index.js");
    const mock = consoleMock.setup();
    console.log("Hello world!");
    console.log("Hello world!");
    const output = mock.restore();
    expect(output).to.eql(["Hello world!\n", "Hello world!\n"]);
  });

  it("should return the output of the given matching string", () => {
    const {consoleMock} = require("../index.js");
    const mock = consoleMock.setup();
    console.log("Hello world!");
    console.log("WHE-PRE");
    console.log("Hello Webhook!");
    mock.restore();
    const result = mock.get("WHE-PRE")
    expect(result).to.eql("WHE-PRE\n");
  });

  it("should return the output of the given matching string with index offset", () => {
    const {consoleMock} = require("../index.js");
    const mock = consoleMock.setup();
    console.log("Hello world!");
    console.log("WHE-PRE");
    console.log("Hello Webhook!");
    mock.restore();
    const result = mock.get("WHE-PRE", 1)
    expect(result).to.eql("Hello Webhook!\n");
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
    expect(result).to.eql({name: "John"});
  });
});