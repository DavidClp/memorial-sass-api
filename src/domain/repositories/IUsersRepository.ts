export type User = {
	id: string;
	email: string;
	senha: string;
	name: string;
};

export interface IUsersRepository {
	findByEmail(email: string): Promise<User | undefined>;
}


