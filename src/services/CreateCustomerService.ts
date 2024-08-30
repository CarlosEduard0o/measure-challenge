import { AppDataSource } from "../data-source";
import { Customer } from "../entity/Customer";

interface ICustomer {
    customerCode: string;
    name: string;
}

export class CreateCustomerService {

    private customerRepository = AppDataSource.getRepository(Customer);

    // Cria um novo cliente e retorna o cliente criado
    async execute({ customerCode, name }: ICustomer): Promise<Customer> {
        const result = await AppDataSource
            .createQueryBuilder()
            .insert()
            .into(Customer)
            .values({ customerCode, name })
            .returning(['customerCode', 'name'])
            .execute();

        return this.getCreatedCustomer(result);
    }

    // Atualiza o nome de um cliente existente
    async update({ customerCode, name }: { customerCode: string; name?: string }): Promise<void> {
        await AppDataSource
            .createQueryBuilder()
            .update(Customer)
            .set({ name })
            .where("customerCode = :customerCode", { customerCode })
            .execute();
    }

    // Encontra um cliente pelo código
    async findByCustomerCode(customerCode: string): Promise<Customer | null> {
        return this.customerRepository.findOneBy({ customerCode });
    }

    // Cria um novo cliente no banco de dados
    async createCustomer(customerData: Partial<Customer>): Promise<Customer> {
        const customer = this.customerRepository.create(customerData);
        return this.customerRepository.save(customer);
    }

    // Método auxiliar para extrair o cliente criado da resposta
    private getCreatedCustomer(result: any): Customer {
        return result.generatedMaps[0] as Customer;
    }
}
