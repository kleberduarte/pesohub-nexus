import type { Config } from "jest";
import nextJest from "next/jest.js";

/**
 * `next/jest` carrega o next.config, resolve os aliases e aplica o mesmo
 * transform que o build usa. Sem ele, os testes compilariam JSX/TS por um
 * caminho diferente do de produção — e passariam a testar outra coisa.
 */
const criarConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
};

export default criarConfig(config);
