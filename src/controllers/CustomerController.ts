import { Request, Response } from "express";
import { CreateCustomerService } from '../services/CreateCustomerService';
import { AppDataSource } from '../data-source';
import { Customer } from '../entity/Customer';

export class CustomerController {
    private createCustomerService = new CreateCustomerService();

    // Método para criar um novo cliente
    async handle(request: Request, response: Response): Promise<Response> {
        const { customerCode, name } = request.body;

        if (!customerCode || !name) {
            return this.badRequestResponse(response, "Os campos 'customerCode' e 'name' são obrigatórios.");
        }

        try {
            const existingCustomer = await this.createCustomerService.findByCustomerCode(customerCode);

            if (existingCustomer) {
                return this.conflictResponse(response, "Cliente já existe com o código fornecido.");
            }

            const newCustomer: Partial<Customer> = { customerCode, name };
            const createdCustomer = await this.createCustomerService.createCustomer(newCustomer);

            return response.status(201).json({
                success: true,
                customer_code: createdCustomer.customerCode,
                message: "Cliente criado com sucesso."
            });
        } catch (error) {
            console.error(error);
            return this.internalServerErrorResponse(response, "Erro ao criar o cliente. Por favor, tente novamente.");
        }
    }

    // Método para atualizar um cliente existente
    async handlePatch(request: Request, response: Response): Promise<Response> {
        const { customerCode, name } = request.body;

        if (!customerCode) {
            return this.badRequestResponse(response, "O campo 'customerCode' é obrigatório.");
        }

        try {
            const existingCustomer = await this.createCustomerService.findByCustomerCode(customerCode);

            if (!existingCustomer) {
                return this.notFoundResponse(response, "Cliente não encontrado com o código fornecido.");
            }

            await this.createCustomerService.update({ customerCode, name });

            return response.status(200).json({
                success: true,
                message: "Cliente atualizado com sucesso."
            });
        } catch (error) {
            console.error(error);
            return this.internalServerErrorResponse(response, "Erro ao atualizar o cliente. Por favor, tente novamente.");
        }
    }

    // Método para listar um cliente por customerCode
    async handleListByCode(request: Request, response: Response): Promise<Response> {
        const { customerCode } = request.params;

        try {
            const customer = await this.createCustomerService.findByCustomerCode(customerCode);

            if (!customer) {
                return this.notFoundResponse(response, "Cliente não encontrado com o código fornecido.");
            }

            return response.status(200).json({
                customer_code: customer.customerCode,
                name: customer.name
            });
        } catch (error) {
            console.error(error);
            return this.internalServerErrorResponse(response, "Erro ao buscar o cliente. Por favor, tente novamente.");
        }
    }

    // Método para listar todos os clientes
    async handleList(request: Request, response: Response): Promise<Response> {
        try {
            const customers = await AppDataSource.getRepository(Customer).find();

            if (customers.length === 0) {
                return this.notFoundResponse(response, "Nenhum cliente encontrado.");
            }

            return response.status(200).json({
                customers: customers.map(customer => ({
                    customer_code: customer.customerCode,
                    name: customer.name
                }))
            });
        } catch (error) {
            console.error(error);
            return this.internalServerErrorResponse(response, "Erro ao buscar os clientes. Por favor, tente novamente.");
        }
    }

    // Respostas de erro padrão
    private badRequestResponse(response: Response, description: string): Response {
        return response.status(400).json({
            error_code: "INVALID_DATA",
            error_description: description
        });
    }

    private notFoundResponse(response: Response, description: string): Response {
        return response.status(404).json({
            error_code: "CUSTOMER_NOT_FOUND",
            error_description: description
        });
    }

    private conflictResponse(response: Response, description: string): Response {
        return response.status(409).json({
            error_code: "CUSTOMER_EXISTS",
            error_description: description
        });
    }

    private internalServerErrorResponse(response: Response, description: string): Response {
        return response.status(500).json({
            error_code: "INTERNAL_SERVER_ERROR",
            error_description: description
        });
    }
}
