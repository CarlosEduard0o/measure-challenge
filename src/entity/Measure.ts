import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Unique,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Customer } from './Customer'; // Importação do relacionamento com a tabela `Customer`

@Entity('measure')
@Unique(['customerCode', 'measureDatetime', 'measureType']) // Definindo a restrição de unicidade
export class Measure {
    @PrimaryGeneratedColumn('uuid')
    measureUuid: string;

    @Column({ type: 'varchar', length: 255 })
    customerCode: string;

    @Column({ type: 'timestamp' })
    measureDatetime: Date;

    @Column({ type: 'varchar', length: 255 })
    measureType: string;

    @Column({ type: 'int' })
    measureValue: number;

    @Column({ type: 'boolean', default: false })
    hasConfirmed: boolean;

    @Column({ type: 'varchar', length: 255, nullable: true })
    imageUrl: string;

    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date;

    @ManyToOne(() => Customer)
    @JoinColumn({ name: 'customerCode', referencedColumnName: 'customerCode' })
    customer: Customer;
}
