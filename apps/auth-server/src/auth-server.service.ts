import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
    private config: ConfigService,
  ) {}

  private verificationCodes = new Map<
    string,
    { code: string; expiresAt: number; firstName: string }
  >();

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
        assignedPropertyId: user.assignedPropertyId || null,
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
    if (data.phone !== undefined) updateData.phone = data.phone ? BigInt(data.phone) : null;
    if (data.role !== undefined)
      updateData.role = roleMapping[data.role] || data.role.toUpperCase();
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.studentStatus !== undefined)
      updateData.studentStatus = data.studentStatus;
    if (data.staffPosition !== undefined)
      updateData.staffPosition = data.staffPosition;
    if (data.requiresAdaAccess !== undefined)
      updateData.requiresAdaAccess = data.requiresAdaAccess;
    if (data.isLocked !== undefined) updateData.isLocked = data.isLocked;
    if (data.lockReason !== undefined) updateData.lockReason = data.lockReason;
    if (data.assignedPropertyId !== undefined) updateData.assignedPropertyId = data.assignedPropertyId;
    if (data.newPassword) {
      updateData.passwordHash = await bcrypt.hash(data.newPassword, 10);
    }

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

      // Check if account is locked
      if (user.isLocked) {
        return {
          locked: true,
          lockReason: user.lockReason || 'Your account has been placed on hold.',
        };
      }

      const payload = {
        username: user.netId,
        role: user.role.toLowerCase(),
        userId: user.userId,
        fName: user.fName,
        lName: user.lName,
        staffPosition: user.staffPosition || null,
        assignedPropertyId: user.assignedPropertyId || null,
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

  // FORGOT PASSWORD
  async searchByNetId(netId: string) {
    const user = await this.prisma.user.findUnique({
      where: { netId },
    });

    if (!user) {
      throw new NotFoundException(`User with NetID ${netId} not found`);
    }

    const maskEmail = (email: string) => {
      const [local, domain] = email.split('@');
      if (local.length <= 3) return `${local[0]}***@${domain}`;
      return `${local.slice(0, 3)}***@${domain}`;
    };

    const maskPhone = (phone: string | null) => {
      if (!phone) return null;
      if (phone.length <= 4) return `******${phone.slice(-1)}`;
      return `${phone.slice(0, 2)}******${phone.slice(-2)}`;
    };

    return {
      netId: user.netId,
      firstName: user.fName,
      maskedEmail: maskEmail(user.email),
      maskedPhone: maskPhone(user.phone?.toString() || null),
      hasPhone: !!user.phone,
    };
  }

  async sendVerificationCode(netId: string, method: 'email' | 'phone') {
    const user = await this.prisma.user.findUnique({
      where: { netId },
    });

    if (!user) {
      throw new NotFoundException(`User with NetID ${netId} not found`);
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    this.verificationCodes.set(netId, {
      code,
      expiresAt,
      firstName: user.fName,
    });

    const currentPort = this.config.get('port') || 3009;
    const commsUrl =
      this.config.get('COMMS_SERVER_URL') || `http://localhost:${currentPort}`;

    if (method === 'email') {
      try {
        await fetch(`${commsUrl}/email/send/forgotPassword`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: user.email,
            firstName: user.fName,
            context: code,
          }),
        });
      } catch (e) {
        console.error('Failed to call comms-server for email:', e);
        throw new Error('Failed to send verification email');
      }
    } else {
      if (!user.phone) throw new BadRequestException('No phone number on file');
      try {
        await fetch(`${commsUrl}/sms/send/forgotPassword`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: `+1${user.phone.toString()}`, // Assuming US numbers
            firstName: user.fName,
            context: code,
          }),
        });
      } catch (e) {
        console.error('Failed to call comms-server for SMS:', e);
        throw new Error('Failed to send verification SMS');
      }
    }

    return { success: true, message: `Code sent via ${method}` };
  }

  async verifyAndResetPassword(resetData: any) {
    const { netId, code, newPassword } = resetData;
    const stored = this.verificationCodes.get(netId);

    if (!stored || stored.code !== code || Date.now() > stored.expiresAt) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { netId },
      data: { passwordHash: hashedPassword },
    });

    this.verificationCodes.delete(netId);
    return { success: true, message: 'Password reset successfully' };
  }
}
