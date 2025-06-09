import { Component, OnInit, Input, Inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'topic-edit-modal-new',
  templateUrl: './topic-edit-modal.component.html',
  styleUrls: ['./topic-edit-modal.component.css']
})
export class TopicEditModalComponent implements OnInit {
  @Input() currentTopic: any; // Data passed from parent via NgbModal

  topicForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    @Inject('kommonitorDataExchangeService') private kommonitorDataExchangeService: any,
    private http: HttpClient,
    private broadcastService: BroadcastService
  ) {
    console.log('TopicEditModalComponent constructor initialized');
    this.topicForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required]
    });
  }

  ngOnInit() {
    console.log('TopicEditModalComponent ngOnInit');
    console.log('Current topic:', this.currentTopic);
    
    // Initialize form with the topic data passed via @Input
    if (this.currentTopic) {
      console.log('Patching form with topic data:', this.currentTopic);
      this.topicForm.patchValue({
        name: this.currentTopic.topicName,
        description: this.currentTopic.topicDescription
      });
    } else {
      console.warn('No topic data provided to modal');
    }
  }

  async onSubmit() {
    console.log('Form submitted:', this.topicForm.value);
    if (this.topicForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.successMessage = '';

      const topicId = this.currentTopic?.topicId;
      const putBody = {
        topicName: this.topicForm.value.name,
        topicDescription: this.topicForm.value.description,
        topicType: this.currentTopic?.topicType,
        topicResource: this.currentTopic?.topicResource,
        subTopics: this.currentTopic?.subTopics
      };
      console.log('Sending topic data:', putBody);

      try {
        const response = await this.http.put(
          `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/topics/${topicId}`,
          putBody
        ).toPromise();
        
        console.log('Topic update response:', response);
        
        this.successMessage = 'success';
        
        // Close modal after a short delay to show success message
        setTimeout(() => {
          this.activeModal.close({
            action: 'updated',
            topic: response
          });
          
          // Broadcast refresh to other components that might need it
          this.broadcastService.broadcast('refreshTopicsOverview');
        }, 1500);
        
      } catch (error: any) {
        console.error('Error updating topic:', error);
        this.errorMessage = error.error || error.message || 'Failed to update topic';
      } finally {
        this.isSubmitting = false;
      }
    } else {
      console.warn('Form is invalid:', this.topicForm.errors);
    }
  }

  hideSuccessAlert() {
    this.successMessage = '';
  }

  hideErrorAlert() {
    this.errorMessage = '';
  }

  cancel() {
    console.log('Modal cancelled');
    this.activeModal.dismiss('cancel');
  }
} 