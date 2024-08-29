import { AppDataSource } from "../data-source";
import { Customer } from "../entity/Customer";

interface ICustomer {
    customerCode: string;
    name: string;
}

export class CreateCustomerService {

    async execute({ customerCode, name }: ICustomer): Promise<Customer> {
        // Inserir um novo cliente
        const result = await AppDataSource
            .createQueryBuilder()
            .insert()
            .into(Customer)
            .values({ customerCode, name })
            .returning(['customerCode', 'name'])
            .execute();
        
        // Retornar o cliente criado
        const createdCustomer = result.generatedMaps[0] as Customer;
        return createdCustomer;
    }

    async update({
        customerCode,
        name
    }: {
        customerCode: string;
        name?: string;
    }): Promise<void> {
        await AppDataSource
            .createQueryBuilder()
            .update(Customer)
            .set({ name })
            .where("customerCode = :customerCode", { customerCode })
            .execute();
    }

    async findByCustomerCode(customerCode: string): Promise<Customer | null> {
        return await AppDataSource
            .getRepository(Customer)
            .findOneBy({ customerCode });
    }

    async createCustomer(customerData: Partial<Customer>): Promise<Customer> {
        const customerRepository = AppDataSource.getRepository(Customer);

        // Criar uma instância da entidade Customer
        const customer = customerRepository.create(customerData);

        // Salvar a nova instância no banco de dados
        return await customerRepository.save(customer);
    }
}