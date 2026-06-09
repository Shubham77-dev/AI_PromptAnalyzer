import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isValidPassword, passwordStrengthTier, validatePasswordStrength } from "./password-policy";

describe("password-policy", () => {
  it("accepts the default migration password", () => {
    assert.equal(isValidPassword("Analyzer@123"), true);
    assert.equal(validatePasswordStrength("Analyzer@123").ok, true);
  });

  it("rejects passwords without uppercase or numbers", () => {
    assert.equal(isValidPassword("password"), false);
    assert.equal(validatePasswordStrength("password").ok, false);
  });

  it("classifies strength tiers", () => {
    assert.equal(passwordStrengthTier("abc"), "weak");
    assert.equal(passwordStrengthTier("Password1"), "fair");
    assert.equal(passwordStrengthTier("Password1!"), "strong");
  });
});
