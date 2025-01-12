import { Inject, Component, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog, MatDialogConfig } from '@angular/material/dialog';

@Component({
  selector: 'app-modal-message',
  templateUrl: './modal-message.component.html',
  styleUrls: ['./modal-message.component.css']
})
export class ModalMessageComponent implements OnInit {

  dialogRef: MatDialogRef<ModalMessageComponent> | null = null;
  message: string;

  constructor(
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) data: {message: string}) { 
      this.message = data.message;
  }

  ngOnInit(): void {
  }

  openDialog(msg: string): MatDialogRef<ModalMessageComponent> {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.id = 'modal-message';
    // dialogConfig.height = '40rem';
    // dialogConfig.width = '40rem';
    dialogConfig.data = { message: msg};
    this.dialogRef = this.dialog.open(ModalMessageComponent,  dialogConfig);
    return this.dialogRef;
  }

  closeDialog() {
    this.dialogRef?.close();
  }

}
