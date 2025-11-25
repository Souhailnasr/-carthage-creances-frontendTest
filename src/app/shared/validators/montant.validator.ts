import { AbstractControl, ValidationErrors, FormGroup } from '@angular/forms';

export function montantValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (value < 0) {
    return { negativeAmount: true };
  }
  return null;
}

export function montantRecouvreInfTotal(group: FormGroup): ValidationErrors | null {
  const montantTotal = group.get('montantTotal')?.value ?? 0;
  const montantRecouvre = group.get('montantRecouvre')?.value ?? 0;
  if (montantRecouvre > montantTotal && montantTotal > 0) {
    return { montantExceeded: true };
  }
  return null;
}


