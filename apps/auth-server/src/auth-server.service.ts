import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserSignup } from '../DTO/userSignUp.dto';
import { UpdateUserDto } from '../DTO/updateUser.dto';
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
    const existingUser = await this.prisma.user.findUnique({
      where: { netId: user.netId },
    });

    if (existingUser) {
      return false;
    }

    // Hash the password with 10 rounds of salting
    const hashedPassword = await bcrypt.hash(user.passwordHash, 10);

    // Map role to Prisma UserRole
    // Simple mapping: uppercase. If invalid, maybe default to STUDENT or handle error.
    // For now, let's assume valid mapping for main roles.
    const roleMapping: Record<string, any> = {
      student: 'STUDENT',
      admin: 'ADMIN',
      staff: 'STAFF',
      // 'faculty': 'STUDENT', // Fallback
      // 'guest': 'STUDENT', // Fallback
    };
    const mappedRole = roleMapping[user.role] || 'STUDENT';

    await this.prisma.user.create({
      data: {
        netId: user.netId,
        utaId: user.utaId,
        passwordHash: hashedPassword,
        fName: user.fName || '',
        mName: user.mName || null,
        lName: user.lName || '',
        email: user.email || `${user.netId}@mavs.uta.edu`,
        role: mappedRole,
        gender: user.gender,
        dob: user.dob,
        studentStatus: user.studentStatus || null,
        staffPosition: user.staffPosition || null,
        requiresAdaAccess: user.requiresAdaAccess ?? false,
      },
    });

    console.log(`User ${user.netId} created.`);
    return true;
  }

  // DELETE
  /*
  The function lets user with role staff and admin to delete user
  staff can delete student
  admin can delete student and staff
  and search by utaID
  */
  async deleteUser(utaID: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { utaId: utaID },
    });

    if (!existingUser) {
      return false;
    }

    await this.prisma.user.delete({
      where: { utaId: utaID },
    });

    console.log(`UTAID ${utaID} deleted.`);
    return true;
  }

  // UPDATE by netId
  async updateUser(netId: string, data: UpdateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { netId },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with netId ${netId} not found`);
    }

    const roleMapping: Record<string, any> = {
      student: 'STUDENT',
      admin: 'ADMIN',
      staff: 'STAFF',
    };

    const updateData: any = {};
    if (data.fName !== undefined) updateData.fName = data.fName;
    if (data.lName !== undefined) updateData.lName = data.lName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined)
      updateData.role = roleMapping[data.role] || data.role.toUpperCase();

    const updated = await this.prisma.user.update({
      where: { netId },
      data: updateData,
    });

    return {
      ...updated,
      phone: updated.phone !== null ? updated.phone.toString() : null,
    };
  }

  // DELETE by netId
  async deleteUserByNetId(netId: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { netId },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with netId ${netId} not found`);
    }

    await this.prisma.user.delete({
      where: { netId },
    });

    console.log(`User ${netId} deleted.`);
    return { deleted: true, netId };
  }

  // READ
  async getAllUser() {
    const users = await this.prisma.user.findMany();
    // BigInt cannot be serialized by JSON.stringify, so convert phone to string
    return users.map((user) => ({
      ...user,
      phone: user.phone !== null ? user.phone.toString() : null,
    }));
  }

  // SEARCH
  async findOne(netId: string) {
    const user = await this.prisma.user.findUnique({
      where: { netId },
    });
    if (!user) return null;
    // BigInt cannot be serialized by JSON.stringify, so convert phone to string
    return {
      ...user,
      phone: user.phone !== null ? user.phone.toString() : null,
    };
  }

  // AUTH STUFF
  // AUTH STUFF
  async signin(netId: string, password: string) {
    const user = await this.findOne(netId);

    if (user) {
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        throw new UnauthorizedException(
          'Incorrect password. Please try again.',
        );
      }

      const payload = {
        username: user.netId,
        role: user.role.toLowerCase(),
        userId: user.userId,
        fName: user.fName,
        lName: user.lName,
        jti: randomUUID(),
      };
      return {
        access_token: await this.jwtService.signAsync(payload),
      };
    }
    throw new UnauthorizedException('No account found with that NetID.');
  }

  // RBAC Checks
  async checkRBACAdmin() {
    console.log('Admin Role guard Passed');
    return { message: 'Admin Role guard Passed' };
  }
  async checkRBACStudent() {
    console.log('Student Role guard Passed');
    return { message: 'Student Role guard Passed' };
  }
  async checkRBACFaculty() {
    console.log('Faculty Role guard Passed');
    return { message: 'Faculty Role guard Passed' };
  }
  async checkRBACGuest() {
    console.log('Guest Role guard Passed');
    return { message: 'Guest Role guard Passed' };
  }
  async checkRBACStaff() {
    console.log('Staff Role guard passed');
    return { message: 'Staff Role guard passed' };
  }
}
