import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { Avocat } from '../../models/avocat.model';
import { AvocatFormComponent } from '../avocat-form/avocat-form.component';
import { AvocatListComponent } from '../avocat-list/avocat-list.component';

@Component({
  selector: 'app-avocats',
  standalone: true,
  imports: [CommonModule, AvocatFormComponent, AvocatListComponent],
  templateUrl: './avocats.component.html',
  styleUrls: ['./avocats.component.scss']
})
export class AvocatsComponent implements OnInit, OnDestroy {
  showForm: boolean = false;
  editingAvocat: Avocat | null = null;
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
    this.editingAvocat = null;
  }

  showEditForm(avocat: Avocat): void {
    this.showForm = true;
    this.isEditMode = true;
    this.editingAvocat = avocat;
  }

  onAvocatSaved(avocat: Avocat): void {
    this.showForm = false;
    this.isEditMode = false;
    this.editingAvocat = null;
  }

  onFormCancelled(): void {
    this.showForm = false;
    this.isEditMode = false;
    this.editingAvocat = null;
  }
}
