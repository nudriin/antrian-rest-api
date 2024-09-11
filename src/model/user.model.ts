export class UserRegisterRequest {
    email: string;
    password: string;
    name: string;
}

export class UserLoginRequest {
    email: string;
    password: string;
}

export class UserResponse {
    email: string;
    name: string;
    token?: string;
}
