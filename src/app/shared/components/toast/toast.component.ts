import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent implements OnInit, OnDestroy {
  currentToast: Toast | null = null;
  private destroy$ = new Subject<void>();
  private timeoutId: any;

  constructor(private toastService: ToastService) { }

  ngOnInit(): void {
    this.toastService.getToastObservable()
      .pipe(takeUntil(this.destroy$))
      .subscribe(toast => {
        this.showToast(toast);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  showToast(toast: Toast): void {
    // Clear any existing timeout to prevent multiple toasts overlapping or premature dismissal
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.currentToast = toast;
    this.timeoutId = setTimeout(() => {
      this.hideToast();
    }, toast.duration || 3000); // Default duration 3 seconds
  }

  hideToast(): void {
    this.currentToast = null;
  }

  getIconClass(type: string): string {
    switch (type) {
      case 'success':
        return 'fa-check-circle';
      case 'error':
        return 'fa-times-circle';
      case 'info':
        return 'fa-info-circle';
      case 'warning':
        return 'fa-exclamation-triangle';
      default:
        return '';
    }
  }
}
