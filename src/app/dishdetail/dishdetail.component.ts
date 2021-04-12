import { Component, Inject, Input, OnInit, ViewChild } from '@angular/core';
import { Dish } from '../shared/dish';
import { DishService } from '../services/dish.service';

import { Params, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { switchMap } from "rxjs/operators";
import { Comment } from '../shared/comment';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { expand, flyInOut, visibility } from '../animations/app.animation';

@Component({
  selector: 'app-dishdetail',
  templateUrl: './dishdetail.component.html',
  styleUrls: ['./dishdetail.component.scss'],
  host: {
		'[@flyInOut]': 'true',
		'style': 'display: block;'
	},
  animations: [
    visibility(),
    flyInOut(),
    expand()
  ]
})
export class DishdetailComponent implements OnInit {

  @ViewChild('cform') commentFormDirective;

  dish: Dish;
  dishcopy: Dish;
  dishIds: string[];
  prev: string;
  next: string;

  comment: Comment;
  commentForm: FormGroup;

  formErrors = {
    'author': '',
    'comment': ''
  }

  validationMessages = {
    'author': {
      'required': 'Author name is required!',
      'minlength': 'Author name must be 2 or more characters long!'
    },
    'comment': {
      'required': 'Comment field is required!'
    }
  }

  errMess: string;
  visibility = 'shown';

  constructor(private dishservice: DishService,
    @Inject('BaseURL') public BaseURL,
    private route: ActivatedRoute,
    private location: Location, private fb: FormBuilder) {
      this.createForm();
  }

  ngOnInit() {
    this.dishservice.getDishIds().subscribe(dishIds => this.dishIds = dishIds);
    this.route.params.pipe(switchMap((params: Params) => { this.visibility = 'hidden'; return this.dishservice.getDish(params['id']); }))
      .subscribe(dish => { this.dish = dish; this.dishcopy = dish; this.setPrevNext(dish.id); this.visibility = 'shown'; }, errmsg => this.errMess = <any>errmsg);
  }

  setPrevNext(dishId: string) {
    const index = this.dishIds.indexOf(dishId);
    this.prev = this.dishIds[(this.dishIds.length + index - 1) % this.dishIds.length];
    this.next = this.dishIds[(this.dishIds.length + index + 1) % this.dishIds.length];
  }

  goBack(): void {
    this.location.back();
  }

  createForm(): void {
    this.commentForm = this.fb.group({
      author: ['', [Validators.required, Validators.minLength(2)] ],
      rating: 5,
      comment: ['', Validators.required ]
    });
    this.commentForm.valueChanges
      .subscribe(data => this.onValueChanged(data));

    this.onValueChanged(); // (re)set validation messages now
  }

  onValueChanged(data?: any) {
    if (!this.commentForm) { return; }
    const form = this.commentForm;
    for (const field in this.formErrors) {
      if (this.formErrors.hasOwnProperty(field)) {
        // clear previous error message (if any)
        this.formErrors[field] = '';
        const control = form.get(field);
        if (control && control.dirty && !control.valid) {
          const messages = this.validationMessages[field];
          for (const key in control.errors) {
            if (control.errors.hasOwnProperty(key)) {
              this.formErrors[field] += messages[key] + ' ';
            }
          }
        }
      }
    }
  }

  onSubmit() {
    this.comment = this.commentForm.value;
    console.log(this.comment);
    this.comment.date = new Date().toISOString();
    this.dishcopy.comments.push(this.comment);
    this.dishservice.putDish(this.dishcopy)
    .subscribe(dish => {
      this.dish = dish; this.dishcopy = dish;
    }, errmsg => { this.dish = null; this.dishcopy = null; this.errMess = <any>errmsg; });
    this.commentFormDirective.resetForm();
    this.commentForm.reset({
      author: '',
      rating: 5,
      comment: ''
    });
  }

}
