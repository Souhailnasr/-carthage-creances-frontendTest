import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form-input.component.html',
  styleUrls: ['./form-input.component.scss']
})
export class FormInputComponent {
  @Input() label: string = '';
  @Input() control: FormControl | null = null;
  @Input() type: string = 'text';
  @Input() id: string = '';
  @Input() placeholder: string = '';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;

  getErrorMessage(): string {
    if (!this.control || !this.control.errors || !this.control.touched) {
      return '';
    }

    const errors = this.control.errors;
    
    if (errors['required']) {
      return `${this.label} est requis`;
    }
    if (errors['email']) {
      return 'Format d\'email invalide';
    }
    if (errors['pattern']) {
      return 'Format invalide';
    }
    if (errors['minlength']) {
      return `${this.label} doit contenir au moins ${errors['minlength'].requiredLength} caractères`;
    }
    if (errors['maxlength']) {
      return `${this.label} ne peut pas dépasser ${errors['maxlength'].requiredLength} caractères`;
    }

    return 'Valeur invalide';
  }

  hasError(): boolean {
    return !!(this.control && this.control.invalid && this.control.touched);
  }
}
