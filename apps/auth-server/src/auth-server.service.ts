import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserSignup } from '../DTO/userSignUp.dto';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import bcrypt from 'node_modules/bcryptjs';

@Injectable()
export class AuthServerService {
  // Creating instance of JWT Service
  constructor(private jwtService:JwtService){}

  private userdb : UserSignup[] = []

  // CREATE
  async createUser(user:UserSignup):Promise<boolean>{
    if(await this.findOne(user.netId)){
      return false
    }

    // Hash the password with 10 rounds of salting and replace plain text password with hash
    user.password = await bcrypt.hash(user.password, 10)
    this.userdb.push(user)
    console.log(user)
    return true
  }

  // READ
  getAllUser(){
    return this.userdb
  }  

  // UPDATE

  // DELETE

  // SEARCH
  async findOne(username:string):Promise<UserSignup | undefined>{
    return this.userdb.find(user => user.netId === username)
  }

  // AUTH STUFF
  async signin(netId:string, password:string){
    const user = await this.findOne(netId);
    if(user){
      const isMatch = await bcrypt.compare(password, user.password)
      if(!isMatch){
        throw new UnauthorizedException();
      }
      
      // Could add 10-digit UTA ID later... in the payload
      // Normalize role to lowercase `role` to keep JWT shape consistent
      const payload = {
        username: user.netId,
        role: user.role,
        jti: randomUUID(), // ensures unique token per login
      };
      return {
        access_token: await this.jwtService.signAsync(payload)
      }
    }
  }

  // REMOVE LATER
  async checkRBACAdmin(){
    console.log("Admin Role guard Passed");
    return { message: 'Admin Role guard Passed' };
  }
  checkRBACStudent(){
    console.log("Student Role guard Passed")
    return { message: 'Student Role guard Passed' };
  }
  checkRBACFaculty(){
    console.log("Faculty Role guard Passed")
    return { message: 'Faculty Role guard Passed' };
  }
  checkRBACGuest(){
    console.log("Guest Role guard Passed")
    return { message: 'Guest Role guard Passed' };
  }
  checkRBACStaff(){
    console.log("Staff Role guard passed")
    return { message: 'Staff Role guard passed' };
  }
}
