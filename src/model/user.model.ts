export class UserRegisterRequest {
    email: string;
    password: string;
    name: string;
}

export class AdminRegisterRequest {
    email: string;
    password: string;
    name: string;
    role: string;
}

export class UserLoginRequest {
    email: string;
    password: string;
}

export class UserResponse {
    id: number;
    email: string;
    name: string;
    role: string;
    token?: string;
}
