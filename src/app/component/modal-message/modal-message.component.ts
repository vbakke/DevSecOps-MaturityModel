import { Inject, Component, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog, MatDialogConfig } from '@angular/material/dialog';
import * as md from 'markdown-it';

@Component({
  selector: 'app-modal-message',
  templateUrl: './modal-message.component.html',
  styleUrls: ['./modal-message.component.css']
})

export class ModalMessageComponent implements OnInit {
  data: DialogInfo;
  markdown: md = md();

  DSOMM_host: string = 'https://raw.githubusercontent.com/devsecopsmaturitymodel';
  DSOMM_url: string = `${this.DSOMM_host}/DevSecOps-MaturityModel-data/main/src/assets/YAML/generated/generated.yaml`;
  meassageTemplates: Record<string, string> = {
    'generated_yaml': `{message}\n\nPlease download the template \`generated.yaml\` from [DSOMM-data](${this.DSOMM_url}) on GitHub`
  };

  constructor(
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<ModalMessageComponent>,
    @Inject(MAT_DIALOG_DATA) data: DialogInfo) {
      this.data = data;
  }

  ngOnInit(): void {
  }

  openDialog(dialogInfo: DialogInfo | string): MatDialogRef<ModalMessageComponent> {
    if (typeof dialogInfo === 'string') {
      dialogInfo = new DialogInfo(dialogInfo);
    }
    if (dialogInfo.template && this.meassageTemplates.hasOwnProperty(dialogInfo.template)) {
      dialogInfo.message = this.meassageTemplates[dialogInfo.template]?.replace('{message', dialogInfo.message);
    }

    dialogInfo.message = this.markdown.render(dialogInfo.message);


    const dialogConfig = new MatDialogConfig();
    dialogConfig.id = 'modal-message';
    dialogConfig.disableClose = true;
    dialogConfig.data = dialogInfo;
    this.dialogRef = this.dialog.open(ModalMessageComponent,  dialogConfig);
    return this.dialogRef;
  }

  closeDialog(buttonName: string) {
    this.dialogRef?.close(buttonName);
  }

}

export class DialogInfo {
  title: string = '';
  template: string | null = '';
  message: string = '';
  buttons: string[] = ['OK'];


  constructor(msg: string = '') {
    this.message = msg;
  }
}
