describe("multiple regex match di string", () => {
  it("tes regex multiple", () => {
    const str = "Hei I Am string, Could be Matched";
    expect(str).toEqual(
      expect.stringMatching(new RegExp(/hei\si\sam\sstring/gi))
    );
    expect(str).toEqual(
      expect.stringMatching(new RegExp(/could\sbe\smatched/gi))
    );
  });
});
