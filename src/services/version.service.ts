import { Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { execSync } from 'node:child_process';

function sh(cmd: string, fallback = 'unknown') {
  try {
    return execSync(cmd).toString().trim();
  } catch {
    return fallback;
  }
}

@Injectable()
export class VersionService {
  private readonly commit = sh('git rev-parse --short HEAD');
  private readonly message = sh('git log -1 --pretty=%B');
  private readonly subject = sh('git log -1 --pretty=%s');
  private readonly author = sh('git log -1 --pretty=%an');
  private readonly date = sh('git log -1 --pretty=%ad');
  private readonly branch = sh('git rev-parse --abbrev-ref HEAD', 'main');

  info() {
    return {
      commit: this.commit,
      subject: this.subject,
      message: this.message, // may be multi-line
      author: this.author,
      date: dayjs(new Date(this.date)).isValid()
        ? dayjs(new Date(this.date)).format('YYYY-MM-DD HH:mm:ss')
        : this.date,
      branch: this.branch,
    };
  }
}
