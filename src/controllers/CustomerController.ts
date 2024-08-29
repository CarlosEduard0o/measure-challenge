import { Request, Response } from "express";
import { CreateCustomerService } from '../services/CreateCustomerService';
import { AppDataSource } from '../data-source';
import { Customer } from '../entity/Customer';

export class CustomerController {
    private createCustomerService: CreateCustomerService;

    constructor() {
        this.createCustomerService = new CreateCustomerService();
    }

    async handle(request: Request, response: Response) {
        const { customerCode, name } = request.body;

        // Validação dos dados recebidos
        if (!customerCode || !name) {
            return response.status(400).json({
                error_code: "INVALID_DATA",
                error_description: "Os campos 'customerCode' e 'name' são obrigatórios."
            });
        }

        try {
            // Verificar se o cliente já existe
            const existingCustomer = await this.createCustomerService.findByCustomerCode(customerCode);

            if (existingCustomer) {
                return response.status(409).json({
                    error_code: "CUSTOMER_EXISTS",
                    error_description: "Cliente já existe com o código fornecido."
                });
            }

            // Criar um novo cliente
            const newCustomer: Partial<Customer> = { customerCode, name };
            const createdCustomer = await this.createCustomerService.createCustomer(newCustomer);

            return response.status(201).json({
                success: true,
                customer_code: createdCustomer.customerCode,
                message: "Cliente criado com sucesso."
            });
        } catch (error) {
            console.error(error);
            return response.status(500).json({
                error_code: "INTERNAL_SERVER_ERROR",
                error_description: "Erro ao criar o cliente. Por favor, tente novamente."
            });
        }
    }

    //Método para atualizar um cliente existente
    async handlePatch(request: Request, response: Response) {
        const { customerCode, name } = request.body;

        // Validação dos dados recebidos
        if (!customerCode) {
            return response.status(400).json({
                error_code: "INVALID_DATA",
                error_description: "O campo 'customerCode' é obrigatório."
            });
        }

        try {
            // Verificar se o cliente existe
            const existingCustomer = await this.createCustomerService.findByCustomerCode(customerCode);

            if (!existingCustomer) {
                return response.status(404).json({
                    error_code: "CUSTOMER_NOT_FOUND",
                    error_description: "Cliente não encontrado com o código fornecido."
                });
            }

            // Atualizar o cliente
            await this.createCustomerService.update({ customerCode, name });

            return response.status(200).json({
                success: true,
                message: "Cliente atualizado com sucesso."
            });
        } catch (error) {
            console.error(error);
            return response.status(500).json({
                error_code: "INTERNAL_SERVER_ERROR",
                error_description: "Erro ao atualizar o cliente. Por favor, tente novamente."
            });
        }
    }

    // Método para listar um cliente por customerCode
    async handleListByCode(request: Request, response: Response) {
        const { customerCode } = request.params;

        try {
            const customer = await this.createCustomerService.findByCustomerCode(customerCode);

            if (!customer) {
                return response.status(404).json({
                    error_code: "CUSTOMER_NOT_FOUND",
                    error_description: "Cliente não encontrado com o código fornecido."
                });
            }

            return response.status(200).json({
                customer_code: customer.customerCode,
                name: customer.name
            });
        } catch (error) {
            console.error(error);
            return response.status(500).json({
                error_code: "INTERNAL_SERVER_ERROR",
                error_description: "Erro ao buscar o cliente. Por favor, tente novamente."
            });
        }
    }

    // Método para listar todos os clientes
    async handleList(request: Request, response: Response) {
        try {
            const customers = await AppDataSource
                .getRepository(Customer)
                .find();

            if (customers.length === 0) {
                return response.status(404).json({
                    error_code: "CUSTOMERS_NOT_FOUND",
                    error_description: "Nenhum cliente encontrado."
                });
            }

            return response.status(200).json({
                customers: customers.map(customer => ({
                    customer_code: customer.customerCode,
                    name: customer.name
                }))
            });
        } catch (error) {
            console.error(error);
            return response.status(500).json({
                error_code: "INTERNAL_SERVER_ERROR",
                error_description: "Erro ao buscar os clientes. Por favor, tente novamente."
            });
        }
    }
}