export interface UserResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  image: string;
}

export interface UsersListResponse {
  users: UserResponse[];
  total: number;
  skip: number;
  limit: number;
}
