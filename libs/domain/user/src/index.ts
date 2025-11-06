/**
 * @fileoverview 用户领域模块导出入口
 * @description 导出用户领域模型的所有公共 API，包括聚合根、值对象、领域服务、Repository接口、领域事件、异常
 */

// ============================================================================
// 聚合根 (Aggregate Roots)
// ============================================================================

export { User } from "./domain/entities/user.entity.js";
export type {
  CreatePlatformUserParams,
  CreateSystemUserParams,
} from "./domain/entities/user.entity.js";

export { UserTenantAssignment } from "./domain/entities/user-tenant-assignment.entity.js";
export type { CreateUserTenantAssignmentParams } from "./domain/entities/user-tenant-assignment.entity.js";

export { UserOrganizationAssignment } from "./domain/entities/user-organization-assignment.entity.js";
export type { CreateUserOrganizationAssignmentParams } from "./domain/entities/user-organization-assignment.entity.js";

// ============================================================================
// 实体 (Entities)
// ============================================================================

export { UserDepartmentAssignment } from "./domain/entities/user-department-assignment.entity.js";
export type { CreateUserDepartmentAssignmentParams } from "./domain/entities/user-department-assignment.entity.js";

// ============================================================================
// 值对象 (Value Objects)
// ============================================================================

export { Email } from "./domain/value-objects/email.vo.js";
export { Username } from "./domain/value-objects/username.vo.js";
export { PasswordHash } from "./domain/value-objects/password-hash.vo.js";
export { UserStatus } from "./domain/value-objects/user-status.vo.js";
export { UserSource } from "./domain/value-objects/user-source.vo.js";
export { UserStatusEnum } from "./domain/value-objects/user-status.enum.js";
export { UserSourceEnum } from "./domain/value-objects/user-source.enum.js";

export { TenantRole } from "./domain/value-objects/tenant-role.vo.js";
export { OrganizationRole } from "./domain/value-objects/organization-role.vo.js";
export { DepartmentRole } from "./domain/value-objects/department-role.vo.js";
export { AssignmentStatus } from "./domain/value-objects/assignment-status.vo.js";
export { AssignmentStatusEnum } from "./domain/value-objects/assignment-status.enum.js";

// ============================================================================
// 领域服务 (Domain Services)
// ============================================================================

export { UserValidationDomainService } from "./domain/services/user-validation.service.js";
export { UserAssignmentDomainService } from "./domain/services/user-assignment.service.js";
export type {
  AssignUserToOrganizationParams,
  AssignUserToDepartmentParams,
  ChangeUserDepartmentInOrganizationParams,
} from "./domain/services/user-assignment.service.js";

// ============================================================================
// Repository 接口 (Repository Interfaces)
// ============================================================================

export type { IUserRepository } from "./domain/repositories/user.repository.js";
export type { IUserTenantAssignmentRepository } from "./domain/repositories/user-tenant-assignment.repository.js";
export type { IUserOrganizationAssignmentRepository } from "./domain/repositories/user-organization-assignment.repository.js";
export type { IUserDepartmentAssignmentRepository } from "./domain/repositories/user-department-assignment.repository.js";

// ============================================================================
// 领域事件 (Domain Events)
// ============================================================================

export { UserCreatedEvent } from "./domain/events/user-created.event.js";
export { UserActivatedEvent } from "./domain/events/user-activated.event.js";
export { UserDisabledEvent } from "./domain/events/user-disabled.event.js";
export { UserLockedEvent } from "./domain/events/user-locked.event.js";
export { UserUnlockedEvent } from "./domain/events/user-unlocked.event.js";
export { UserPasswordChangedEvent } from "./domain/events/user-password-changed.event.js";
export { UserPasswordResetEvent } from "./domain/events/user-password-reset.event.js";
export { UserAssignedToTenantEvent } from "./domain/events/user-assigned-to-tenant.event.js";
export { UserUnassignedFromTenantEvent } from "./domain/events/user-unassigned-from-tenant.event.js";

// ============================================================================
// 领域异常 (Domain Exceptions)
// ============================================================================

export { InvalidEmailError } from "./domain/exceptions/invalid-email.error.js";
export { InvalidUsernameError } from "./domain/exceptions/invalid-username.error.js";
export { InvalidPasswordError } from "./domain/exceptions/invalid-password.error.js";
export { InvalidNicknameError } from "./domain/exceptions/invalid-nickname.error.js";
export { InvalidUserSourceError } from "./domain/exceptions/invalid-user-source.error.js";
export { InvalidStatusTransitionError } from "./domain/exceptions/invalid-status-transition.error.js";

export { EmailAlreadyExistsError } from "./domain/exceptions/email-already-exists.error.js";
export { UsernameAlreadyExistsError } from "./domain/exceptions/username-already-exists.error.js";
export { NicknameAlreadyExistsError } from "./domain/exceptions/nickname-already-exists.error.js";

export { UserNotAssignedToTenantError } from "./domain/exceptions/user-not-assigned-to-tenant.error.js";
export { UserAlreadyAssignedToTenantError } from "./domain/exceptions/user-already-assigned-to-tenant.error.js";

export { UserNotAssignedToOrganizationError } from "./domain/exceptions/user-not-assigned-to-organization.error.js";
export { UserAlreadyAssignedToOrganizationError } from "./domain/exceptions/user-already-assigned-to-organization.error.js";

export { UserNotAssignedToDepartmentError } from "./domain/exceptions/user-not-assigned-to-department.error.js";
export { UserAlreadyAssignedToDepartmentError } from "./domain/exceptions/user-already-assigned-to-department.error.js";
export { UserAlreadyAssignedToDepartmentInOrganizationError } from "./domain/exceptions/user-already-assigned-to-department-in-organization.error.js";
