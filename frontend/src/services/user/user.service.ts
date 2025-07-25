import BaseService from "../base.service";

interface UserResponse {
  credits: number;
}

class UserService extends BaseService {
  constructor() {
    super("/users");
  }

  getUserCredits = async (): Promise<UserResponse> => {
    try {
      const response = await this.get<UserResponse>(
        "/credits"
      );
      return response;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      throw error;
    }
  };

}

export default new UserService();
