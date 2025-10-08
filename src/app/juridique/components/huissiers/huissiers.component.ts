import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { Huissier } from '../../models/huissier.model';
import { HuissierFormComponent } from '../huissier-form/huissier-form.component';
import { HuissierListComponent } from '../huissier-list/huissier-list.component';

@Component({
  selector: 'app-huissiers',
  standalone: true,
  imports: [CommonModule, HuissierFormComponent, HuissierListComponent],
  templateUrl: './huissiers.component.html',
  styleUrls: ['./huissiers.component.scss']
})
export class HuissiersComponent implements OnInit, OnDestroy {
  showForm: boolean = false;
  editingHuissier: Huissier | null = null;
  isEditMode: boolean = false;
  private destroy$ = new Subject<void>();

  constructor() {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  showCreateForm(): void {
    this.showForm = true;
    this.isEditMode = false;
    this.editingHuissier = null;
  }

  showEditForm(huissier: Huissier): void {
    this.showForm = true;
    this.isEditMode = true;
    this.editingHuissier = huissier;
  }

  onHuissierSaved(huissier: Huissier): void {
    this.showForm = false;
    this.isEditMode = false;
    this.editingHuissier = null;
  }

  onFormCancelled(): void {
    this.showForm = false;
    this.isEditMode = false;
    this.editingHuissier = null;
  }
}
