import { Field } from "type-graphql";
import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from "typeorm";
import { User } from "./User";

@Entity()
export class Subscription {
  @Field()
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.subscriptions)
  subscriber: User;

  @ManyToOne(() => User, (user) => user.subscribers)
  subscribedTo: User;

  @Field(() => String)
  @CreateDateColumn()
  date: Date;
}
