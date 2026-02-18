import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserSignup } from '../DTO/userSignUp.dto';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '@common/prisma/prisma.service';

@Injectable()
export class AuthServerService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  // CREATE
  async createUser(user: UserSignup): Promise<boolean> {
    const existing = await this.findOne(user.netId);
    if (existing) {
      return false;
    }

    // Hash the password with 10 rounds of salting
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user.password, salt);

    await this.prisma.user.create({
      data: {
        netId: user.netId,
        fName: user.fName,
        lName: user.lName,
        email: user.email,
        passwordHash: hashedPassword,
        role: user.role.toUpperCase() as any, // Convert to enum
        utaId: `1001${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`, // Generate temp UTA ID
      },
    });

    console.log(`User created: ${user.netId}`);
    return true;
  }

  // READ
  async getAllUser() {
    const users = await this.prisma.user.findMany({
      select: {
        netId: true,
        fName: true,
        lName: true,
        email: true,
        role: true,
      },
    });

    // Map to match the expected format
    return users.map(u => ({
      netId: u.netId,
      fName: u.fName,
      lName: u.lName,
      email: u.email,
      role: u.role.toLowerCase(),
      password: '', // Don't expose password
    }));
  }

  // UPDATE
  async updateUser(netId: string, updates: any): Promise<boolean> {
    try {
      await this.prisma.user.update({
        where: { netId },
        data: {
          fName: updates.fName,
          lName: updates.lName,
          email: updates.email,
          role: updates.role?.toUpperCase() as any,
        },
      });
      console.log(`User updated: ${netId}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  // DELETE
  async remove(netId: string): Promise<boolean> {
    try {
      await this.prisma.user.delete({
        where: { netId },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // SEARCH
  async findOne(username: string): Promise<any | undefined> {
    const user = await this.prisma.user.findUnique({
      where: { netId: username },
    });

    if (!user) return undefined;

    // Map to expected format
    return {
      netId: user.netId,
      fName: user.fName,
      lName: user.lName,
      email: user.email,
      role: user.role.toLowerCase(),
      password: user.passwordHash, // For bcrypt comparison
    };
  }

  // AUTH STUFF
  async signin(netId: string, password: string) {
    const user = await this.findOne(netId);
    if (user) {
      console.log(`Signin attempt for ${netId}`);
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log('Password mismatch');
        throw new UnauthorizedException('Invalid NetID or Password');
      }

      // Get full user data from database
      const fullUser = await this.prisma.user.findUnique({
        where: { netId },
      });

      if (!fullUser) {
        throw new UnauthorizedException('User data not found');
      }

      const payload = {
        username: user.netId,
        role: user.role,
        userId: fullUser.userId,
        fName: fullUser.fName,
        lName: fullUser.lName,
        jti: randomUUID(),
      };
      return {
        access_token: await this.jwtService.signAsync(payload),
      };
    } else {
      console.log(`Signin failed: User ${netId} not found`);
      throw new UnauthorizedException('Invalid NetID or Password');
    }
  }

  // REMOVE LATER
  async checkRBACAdmin() {
    console.log('Admin Role guard Passed');
    return { message: 'Admin Role guard Passed' };
  }
  checkRBACStudent() {
    console.log('Student Role guard Passed');
    return { message: 'Student Role guard Passed' };
  }
  checkRBACFaculty() {
    console.log('Faculty Role guard Passed');
    return { message: 'Faculty Role guard Passed' };
  }
  checkRBACGuest() {
    console.log('Guest Role guard Passed');
    return { message: 'Guest Role guard Passed' };
  }
  checkRBACStaff() {
    console.log('Staff Role guard passed');
    return { message: 'Staff Role guard passed' };
  }
}
