import { Injectable } from '@nestjs/common';
import { UserSignup } from '../entity/user.dto';
@Injectable()
export class AuthServerService {

  private userdb : UserSignup[] = []

  getHello():string{
    return 'Hello world'
  }

  createUser(user:UserSignup):string{
    this.userdb.push(user)
    console.log(user)
    return `user ${user.netId} was added`
  }

  getAllUser(){
    return this.userdb
  }



}
