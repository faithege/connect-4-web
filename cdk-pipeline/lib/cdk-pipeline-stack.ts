import { Stack, StackProps, Construct, SecretValue } from '@aws-cdk/core';
import { CdkPipeline, CodePipeline, SimpleSynthAction } from '@aws-cdk/pipelines';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as ssm from '@aws-cdk/aws-ssm';
import * as iam from '@aws-cdk/aws-iam';
import { BuildSpec, LinuxBuildImage, PipelineProject, Project } from '@aws-cdk/aws-codebuild';

const deployPermissions: iam.PolicyStatementProps[] =   [
  {
    actions: [
      "cloudformation:List*",
      "cloudformation:Get*",
      "cloudformation:ValidateTemplate"
    ],
    resources: [
      "*"
    ]
  },
  {

    actions: [
      "cloudformation:CreateStack",
      "cloudformation:CreateUploadBucket",
      "cloudformation:DeleteStack",
      "cloudformation:Describe*",
      "cloudformation:UpdateStack"
    ],
    resources: [
      "arn:aws:cloudformation:eu-west-1:352651073960:stack/connect4-prod/*"
    ]
  },
  {

    actions: [
      "lambda:Get*",
      "lambda:List*",
      "lambda:CreateFunction"
    ],
    resources: [
      "*"
    ]
  },
  {

    actions: [
      "s3:GetBucketLocation",
      "s3:CreateBucket",
      "s3:DeleteBucket",
      "s3:ListBucket",
      "s3:GetBucketPolicy",
      "s3:PutBucketPolicy",
      "s3:DeleteBucketPolicy",
      "s3:ListBucketVersions",
      "s3:PutAccelerateConfiguration",
      "s3:GetEncryptionConfiguration",
      "s3:PutEncryptionConfiguration"
    ],
    resources: [
      "arn:aws:s3:::connect4*serverlessdeploy*"
    ]
  },
  {

    actions: [
      "s3:PutObject",
      "s3:GetObject",
      "s3:DeleteObject"
    ],
    resources: [
      "arn:aws:s3:::connect4*serverlessdeploy*"
    ]
  },
  {

    actions: [
      "lambda:AddPermission",
      "lambda:CreateAlias",
      "lambda:DeleteFunction",
      "lambda:InvokeFunction",
      "lambda:PublishVersion",
      "lambda:RemovePermission",
      "lambda:Update*"
    ],
    resources: [
      "arn:aws:lambda:eu-west-1:352651073960:function:connect4-prod-*"
    ]
  },
  {

    actions: [
      "apigateway:GET",
      "apigateway:POST",
      "apigateway:PUT",
      "apigateway:DELETE",
      "apigateway:PATCH",
      "apigateway:UpdateRestApiPolicy"
    ],
    resources: [
      "arn:aws:apigateway:*::/restapis*",
      "arn:aws:apigateway:*::/apikeys*",
      "arn:aws:apigateway:*::/usageplans*"
    ]
  },
  {

    actions: [
      "iam:PassRole"
    ],
    resources: [
      "arn:aws:iam::352651073960:role/*"
    ]
  },
  {

    actions: ["kinesis:*"],
    resources: [
      "arn:aws:kinesis:*:*:stream/connect4-prod-eu-west-1"
    ]
  },
  {

    actions: [
      "iam:GetRole",
      "iam:CreateRole",
      "iam:PutRolePolicy",
      "iam:DeleteRolePolicy",
      "iam:DeleteRole"
    ],
    resources: [
      "arn:aws:iam::352651073960:role/connect4-prod-eu-west-1-lambdaRole"
    ]
  },
  {

    actions: ["sqs:*"],
    resources: [
      "arn:aws:sqs:*:352651073960:connect4-prod-eu-west-1"
    ]
  },
  {

    actions: [
      "cloudwatch:GetMetricStatistics"
    ],
    resources: [
      "*"
    ]
  },
  {
    actions: [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:DeleteLogGroup"
    ],
    resources: [
      "arn:aws:logs:eu-west-1:352651073960:*"
    ],
  },
  {
    actions: [
      "logs:PutLogEvents"
    ],
    resources: [
      "arn:aws:logs:eu-west-1:352651073960:*"
    ],
  },
  {

    actions: [
      "logs:DescribeLogStreams",
      "logs:DescribeLogGroups",
      "logs:FilterLogEvents"
    ],
    resources: [
      "*"
    ]
  },
  {

    actions: [
      "events:Put*",
      "events:Remove*",
      "events:Delete*"
    ],
    resources: [
      "arn:aws:events:eu-west-1:352651073960:rule/connect4-prod-eu-west-1"
    ]
  },
  {

    actions: [
      "events:DescribeRule"
    ],
    resources: [
      "arn:aws:events:eu-west-1:352651073960:rule/connect4-prod-*"
    ]
  },
  {

    actions: [
      "dynamodb:*"
    ],
    resources: [
      "arn:aws:dynamodb:*:352651073960:table/*"
    ]
  }
]

export class CdkPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const sourceArtifact = new codepipeline.Artifact();
    const cloudAssemblyArtifact = new codepipeline.Artifact();

    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: 'GitHub',
      output: sourceArtifact,
      oauthToken: SecretValue.secretsManager('GITHUB_TOKEN_NAME'),
      trigger: codepipeline_actions.GitHubTrigger.POLL,
      // Replace these with your actual GitHub project info
      owner: 'faithege',
      repo: 'connect-4-web', 
      branch: 'main'
    });

    const synthAction = SimpleSynthAction.standardNpmSynth({
      sourceArtifact,
      cloudAssemblyArtifact,

      // Use this if you need a build step (if you're not using ts-node
      // or if you have TypeScript Lambdas that need to be compiled).
      buildCommand: 'npm run build',
      subdirectory: 'cdk-pipeline'
    })

    //synthAction.

    // CDK PIPELINE
    const cdkPipeline = new CdkPipeline(this, 'CdkPipeline', {
      cloudAssemblyArtifact,
      sourceAction,
      synthAction
    });
    cdkPipeline.stage('Build')

    // SERVERLESS PIPELINE
    const serverlessPipeline = new codepipeline.Pipeline(this, 'ServerlessPipeline', {
      crossAccountKeys: false,
    })
    const sourceStage = serverlessPipeline.addStage({
      stageName: 'Source'
    });
    sourceStage.addAction(sourceAction);

    const buildStage = serverlessPipeline.addStage({
      stageName: 'Build'
    });
    


    const buildProject = new PipelineProject(this, 'BuildProject', {
      environment: {buildImage: LinuxBuildImage.fromCodeBuildImageId('aws/codebuild/standard:5.0')},
      buildSpec: BuildSpec.fromObject({
        version: 0.1,
        phases:{
          install:{ commands: ['ls -a && cd connect4-sls && npm install']},
          build:{ commands: ['./node_modules/.bin/serverless deploy --stage prod | tee deploy.out']}, // //...build.sh
          //post_build:{ commands: ['./test.sh']} //./... deploy.sh
          // are there any other phases? test?
        }
      })
    })

    deployPermissions.forEach(permission => {
      buildProject.addToRolePolicy(new iam.PolicyStatement(permission))
    })
    // buildProject.addToRolePolicy(new iam.PolicyStatement({
    //   actions: [
    //     "ssm:GetParameter"
    //   ],
    //   resources: [
    //     "*"
    //   ]
    // }))
    

    const buildAction = new codepipeline_actions.CodeBuildAction({
      input: sourceArtifact,
      project: buildProject,
      actionName: 'BuildBackend'
    })

    buildStage.addAction(buildAction)

    //take things in small chunks -> work with serverless code first
  }
}

