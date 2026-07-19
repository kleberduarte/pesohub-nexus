import * as bcrypt from "bcrypt";
import { CreateOperadorUseCase } from "./create-operador.usecase";

describe("CreateOperadorUseCase", () => {
  it("hasheia a senha antes de persistir e nunca grava a senha em texto puro", async () => {
    const operadores = {
      create: jest.fn().mockImplementation((data) => Promise.resolve({ id: "op-1", ...data })),
    };
    const usecase = new CreateOperadorUseCase(operadores as any);

    const result = await usecase.execute("cliente-a", {
      numero: 1,
      nome: "Operador 1",
      senha: "1234",
    });

    const persistedData = operadores.create.mock.calls[0][0];
    expect(persistedData.senha).not.toBe("1234");
    expect(await bcrypt.compare("1234", persistedData.senha)).toBe(true);
    expect(persistedData.clienteId).toBe("cliente-a");
    expect(result.id).toBe("op-1");
  });
});
