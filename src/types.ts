export type Role = 'Admin' | 'Merchandising' | 'Pattern' | 'Sample Room' | 'CAD' | 'IE' | 'QA';

export interface Department {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  departmentId: string;
  role: Role;
  avatar: string;
}

export type StageType =
  | 'Proto Sample'
  | 'Fit Sample'
  | 'PP Sample'
  | 'Size Set Sample'
  | 'Sales Sample'
  | 'TOP Sample'
  | 'Final Approval'
  | 'Production Ready';

export type StageStatus = 'Pending' | 'InProgress' | 'Completed' | 'OnHold' | 'Cancelled';

export type FileType = 'Pattern' | 'DXF' | 'TechPack' | 'BOM' | 'MeasurementSheet' | 'Photo' | 'Email';

export interface Attachment {
  id: string;
  stageId: string;
  fileType: FileType;
  fileName: string;
  fileUrl: string;
  fileSize: string;
  version: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Stage {
  id: string;
  styleId: string;
  stageType: StageType;
  requestDate: string;
  deadline: string;
  actualCompletionDate?: string;
  assigneeId?: string; // User ID
  status: StageStatus;
  note: string;
  progressPercent: number; // 0 - 100
}

export type StyleStatus = 'Active' | 'Completed' | 'OnHold' | 'Cancelled';

export interface Style {
  id: string;
  styleCode: string;
  customer: string;
  season: string;
  buyer: string;
  factory: string;
  status: StyleStatus;
  createdBy: string;
  createdAt: string;
  stages: Stage[];
}

export interface ActivityLog {
  id: string;
  styleId?: string;
  styleCode?: string;
  entityType: 'Style' | 'Stage' | 'Attachment';
  entityId: string;
  action: string; // e.g., "Created Style", "Updated Status", "Uploaded Pattern"
  changedBy: string;
  changedByName: string;
  changedByRole: Role;
  changedAt: string;
  oldValue?: string;
  newValue?: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  relatedStyleId?: string;
  relatedStageId?: string;
  createdAt: string;
}
