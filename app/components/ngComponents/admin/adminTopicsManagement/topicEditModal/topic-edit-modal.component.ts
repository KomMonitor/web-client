import { Component, OnInit, Input, Inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';

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

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    @Inject('kommonitorDataExchangeService') private kommonitorDataExchangeService: any,
    private broadcastService: BroadcastService
  ) {
    console.log('TopicEditModalComponent constructor initialized');
    this.topicForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      parentTopicId: ['']
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
        description: this.currentTopic.topicDescription,
        parentTopicId: this.currentTopic.parentTopicId
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

      const topicData = {
        ...this.topicForm.value,
        id: this.currentTopic?.topicId
      };
      console.log('Sending topic data:', topicData);

      try {
        const response = await this.kommonitorDataExchangeService.updateTopic(topicData);
        console.log('Topic update response:', response);
        
        // Close modal and return the updated topic
        this.activeModal.close({
          action: 'updated',
          topic: response
        });
        
        // Broadcast refresh to other components that might need it
        this.broadcastService.broadcast('refreshTopicsOverview');
        
      } catch (error: any) {
        console.error('Error updating topic:', error);
        this.errorMessage = error.message || 'Failed to update topic';
      } finally {
        this.isSubmitting = false;
      }
    } else {
      console.warn('Form is invalid:', this.topicForm.errors);
    }
  }

  cancel() {
    console.log('Modal cancelled');
    this.activeModal.dismiss('cancel');
  }
} 