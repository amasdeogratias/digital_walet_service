import { Request, Response } from 'express';
import { AuthService } from '../services/authService';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  public register = async (request: Request, response: Response): Promise<void> => {
    const result = await this.authService.register(request.body);
    response.status(201).json(result);
  };

  public login = async (request: Request, response: Response): Promise<void> => {
    const result = await this.authService.login(request.body);
    response.status(200).json(result);
  };
}
