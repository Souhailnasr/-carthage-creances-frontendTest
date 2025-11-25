import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'tnd',
  standalone: true
})
export class TndPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    const numericValue = value ?? 0;
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 2
    }).format(numericValue);
  }
}


