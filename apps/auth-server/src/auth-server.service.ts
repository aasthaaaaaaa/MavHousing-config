import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserSignup } from '../DTO/userSignUp.dto';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AuthServerService {
  // Creating instance of JWT Service
  constructor(private jwtService:JwtService){
    this.loadUsers();
  }

  private userdb : UserSignup[] = []
  private readonly dbPath = path.resolve('apps/auth-server/users.json');

  private loadUsers() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const data = fs.readFileSync(this.dbPath, 'utf8');
        this.userdb = JSON.parse(data);
        console.log(`Loaded ${this.userdb.length} users from ${this.dbPath}`);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  private saveUsers() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.userdb, null, 2));
    } catch (error) {
      console.error('Error saving users:', error);
    }
  }

  // CREATE
  async createUser(user:UserSignup):Promise<boolean>{
    if(await this.findOne(user.netId)){
      return false
    }

    // Hash the password with 10 rounds of salting and replace plain text password with hash
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt)
    this.userdb.push(user)
    this.saveUsers();
    console.log(`User created: ${user.netId}`)
    return true
  }

  // READ
  getAllUser(){
    return this.userdb
  }  

  // UPDATE

  // DELETE
  remove(netId: string): boolean {
    const initialLength = this.userdb.length;
    this.userdb = this.userdb.filter(user => user.netId !== netId);
    if (this.userdb.length !== initialLength) {
      this.saveUsers();
      return true;
    }
    return false;
  }

  // SEARCH
  async findOne(username:string):Promise<UserSignup | undefined>{
    return this.userdb.find(user => user.netId === username)
  }

  // AUTH STUFF
  async signin(netId:string, password:string){
    const user = await this.findOne(netId);
    if(user){
      console.log(`Signin attempt for ${netId}. Stored hash: ${user.password}`);
      const isMatch = await bcrypt.compare(password, user.password)
      if(!isMatch){
        console.log("Password mismatch");
        throw new UnauthorizedException('Invalid NetID or Password');
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
    } else {
      console.log(`Signin failed: User ${netId} not found`);
      throw new UnauthorizedException('Invalid NetID or Password');
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
