export class ChefAmiableNotification {
  id: string = '';
  titre: string = '';
  message: string = '';
  dateCreation: Date = new Date();
  lu: boolean = false;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR' = 'INFO';
  userId: string = '';
  dossierId?: string = '';
  actionId?: string = '';

  constructor(data?: Partial<ChefAmiableNotification>) {
    Object.assign(this, data);
  }

  getFormattedDate(): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(this.dateCreation));
  }

  getRelativeTime(): string {
    const now = new Date();
    const diff = now.getTime() - new Date(this.dateCreation).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    return this.getFormattedDate();
  }
}
